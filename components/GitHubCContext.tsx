"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import axios from 'axios'
import FileTree from './FileTree'
import { debounce } from '@/lib/helpers'

const GitHubCContext = () => {
  const [githubUrl, setGithubUrl] = useState('')
  const [ccontextCommand, setCcontextCommand] = useState('ccontext -gm')
  const [output, setOutput] = useState('')
  const [clipboardContent, setClipboardContent] = useState('')
  const [fileTree, setFileTree] = useState(null)
  const { toast } = useToast()

  const debouncedSetGithubUrl = useCallback(
    debounce((value: string) => setGithubUrl(value), 300),
    []
  )

  const debouncedSetCcontextCommand = useCallback(
    debounce((value: string) => setCcontextCommand(value), 300),
    []
  )

  const handleCloneAndRun = async () => {
    try {
      setOutput('Processing...')
      setClipboardContent('')
      setFileTree(null)
      const response = await axios.post('/api/clone-and-run', {
        githubUrl,
        ccontextCommand,
      })
      setOutput(response.data.output || response.data.error)
      setClipboardContent(response.data.clipboardContent || '')
      setFileTree(response.data.fileTree || null)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "An error occurred while processing your request.",
        variant: "destructive",
      })
      setOutput("An error occurred while processing your request.")
    }
  }

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    })
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Enter GitHub URL"
        defaultValue={githubUrl}
        onChange={(e) => debouncedSetGithubUrl(e.target.value)}
      />
      <Input
        placeholder="CContext command"
        defaultValue={ccontextCommand}
        onChange={(e) => debouncedSetCcontextCommand(e.target.value)}
      />

      <Button onClick={handleCloneAndRun} className='flex w-full'>Clone and Run CContext</Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Command Output:</h3>
          <Textarea
            placeholder="Output will appear here..."
            value={output}
            readOnly
            className="h-64 font-mono text-sm mb-2"
          />
          {output && (
            <Button onClick={() => handleCopyToClipboard(output)} className='flex w-full mb-4'>Copy Output to Clipboard</Button>
          )}
        </div>

        {fileTree && (
          <div>
            <FileTree tree={fileTree} />
          </div>
        )}
      </div>
    </div>
  )
}

export default GitHubCContext