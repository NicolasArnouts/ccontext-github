"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import axios from 'axios'
import { debounce } from '@/lib/helpers-client'
import MarkdownDisplay from '@/components/MarkdownDisplay'

const GitHubCContext = () => {
  const [githubUrl, setGithubUrl] = useState('')
  const [ccontextCommand, setCcontextCommand] = useState('ccontext -gm')
  const [output, setOutput] = useState('')
  const [markdownContent, setMarkdownContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [envId, setEnvId] = useState<string | null>(null)
  const { toast } = useToast()

  const debouncedSetGithubUrl = useCallback(
    debounce((value: string) => setGithubUrl(value), 100),
    []
  )

  const debouncedSetCcontextCommand = useCallback(
    debounce((value: string) => setCcontextCommand(value), 100),
    []
  )

  useEffect(() => {
    // Check environment status every minute
    const intervalId = setInterval(async () => {
      if (envId) {
        try {
          const response = await axios.get(`/api/environment-status?envId=${envId}`);
          if (response.data.isActive) {
            toast({
              title: "Environment Active",
              description: `Environment ${envId} is still active.`,
            });
          }
        } catch (error) {
          console.error('Error checking environment status:', error);
          setEnvId(null);
        }
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [envId, toast]);

  const handleCloneAndRun = async () => {
    try {
      setIsLoading(true)
      setOutput('Processing...')
      setMarkdownContent(null)
      const response = await axios.post('/api/clone-and-run', {
        githubUrl,
        ccontextCommand,
        envId
      })
      setOutput(response.data.output || response.data.error)
      setMarkdownContent(response.data.markdownContent || null)
      setEnvId(response.data.repositoryId)
      toast({
        title: "Success",
        description: "Command executed successfully.",
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "An error occurred while processing your request.",
        variant: "destructive",
      })
      setOutput("An error occurred while processing your request.")
    } finally {
      setIsLoading(false)
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
        disabled={!!envId}
      />
      <Input
        placeholder="CContext command"
        defaultValue={ccontextCommand}
        onChange={(e) => debouncedSetCcontextCommand(e.target.value)}
      />

      <Button onClick={handleCloneAndRun} className='flex w-full' disabled={isLoading}>
        {isLoading ? 'Processing...' : (envId ? 'Run Command' : 'Clone and Run CContext')}
      </Button>
      <div className="w-full">
        <div>
          <h3 className="text-lg font-semibold mb-2">Command Output:</h3>
          <Textarea
            placeholder="Output will appear here..."
            value={output}
            readOnly
            className="h-64 font-mono text-sm mb-2 w-full"
          />
          {output && (
            <Button onClick={() => handleCopyToClipboard(output)} className='flex w-full mb-4'>Copy Output to Clipboard</Button>
          )}
        </div>
      </div>
      {markdownContent && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Generated Markdown:</h3>
          <MarkdownDisplay content={markdownContent} />
          <Button onClick={() => handleCopyToClipboard(markdownContent)} className='flex w-full mt-2'>Copy Markdown to Clipboard</Button>
        </div>
      )}
      {envId && (
        <div>
          <p>Active Environment ID: {envId}</p>
        </div>
      )}
    </div>
  )

}

export default GitHubCContext