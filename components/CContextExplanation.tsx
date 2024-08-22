import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, GitBranch, Search } from "lucide-react";

const CContextExplanation = () => {
  return (
    <div className="w-full rounded-3xl px-4 py-12 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Welcome to GitHub CContext
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 flex items-center">
                <Code className="mr-2" /> What is CContext?
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                CContext is a powerful tool that analyzes codebases and
                generates comprehensive summaries. It helps developers quickly
                understand large projects by providing key insights and
                structure overviews.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                <GitBranch className="mr-2" /> GitHub CContext
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                GitHub CContext combines the power of CContext with GitHub
                repositories. It allows you to analyze any public GitHub repo,
                providing instant insights without the need to clone or download
                the code locally.
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-8 bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
              <Search className="mr-2" /> How It Works
            </h3>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Enter a GitHub repository URL</li>
              <li>Our system clones the repository</li>
              <li>CContext analyzes the codebase</li>
              <li>Receive a detailed summary and structure overview</li>
              <li>Chat with AI about the analyzed codebase</li>
            </ol>
          </CardContent>
          {/* <CardFooter>
            <Button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
              Get Started <ArrowRight className="ml-2" />
            </Button>
          </CardFooter> */}
        </Card>
      </motion.div>
    </div>
  );
};

export default CContextExplanation;
