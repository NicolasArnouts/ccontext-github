"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import axios from 'axios'

const CleanupButton = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCleanup = async () => {
    try {
      setIsLoading(true)
      await axios.post('/api/cleanup')
      toast({
        title: "Success",
        description: "Cleanup completed successfully.",
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "An error occurred during cleanup.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCleanup} disabled={isLoading}>
      {isLoading ? 'Cleaning up...' : 'Cleanup Expired Environments'}
    </Button>
  )
}

export default CleanupButton