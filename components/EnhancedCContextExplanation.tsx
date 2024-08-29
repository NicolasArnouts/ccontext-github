import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const EnhancedCContextExplanation: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6 shadow-lg"
    >
      <h2 className="text-3xl font-bold text-center mb-6 text-purple-600 dark:text-purple-400">
        🚀 Welcome to GitHub CContext: Your AI-Powered Code Companion! 🤖
      </h2>

      <div className="space-y-6">
        <Section
          title="🔍 What is CContext-GitHub?"
          content="CContext-GitHub is a revolutionary tool that brings the power of AI to your GitHub exploration! It's like having a brilliant developer instantly analyze and explain any GitHub repository for you."
        />

        <Section title="🌟 Why CContext-GitHub is Amazing:">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Instant Code Comprehension</strong> 📚: Understand large
              codebases in minutes, not hours!
            </li>
            <li>
              <strong>AI-Powered Insights</strong> 🧠: Get smart summaries and
              explanations about code structure and functionality.
            </li>
            <li>
              <strong>Interactive Exploration</strong> 💬: Chat with AI about
              the codebase, ask questions, and dive deeper into specific parts.
            </li>
            <li>
              <strong>No Local Setup Required</strong> ☁️: Analyze repos
              directly from GitHub URLs - no need to clone or download anything!
            </li>
            <li>
              <strong>Time-Saver for Developers</strong> ⏱️: Quickly grasp new
              projects, conduct code reviews, or onboard team members.
            </li>
          </ul>
        </Section>

        <Section title="🔧 How CContext-GitHub Works Its Magic:">
          <ol className="list-decimal pl-5 space-y-2">
            <li>🔗 Enter any public GitHub repository URL</li>
            <li>🤖 Our AI clones and analyzes the entire codebase</li>
            <li>📊 Receive a comprehensive summary and structure overview</li>
            <li>💡 Chat with AI to ask questions and explore further</li>
            <li>🚀 Gain deep insights and understanding in record time!</li>
          </ol>
        </Section>

        <Section title="🛠️ Powered by CContext CLI:">
          <p>
            CContext-GitHub leverages the powerful{" "}
            <Link
              href="https://github.com/NicolasArnouts/ccontext"
              className="text-blue-500 hover:underline"
            >
              CContext CLI tool
            </Link>
            , an open-source project that revolutionizes code analysis. Check
            out the CLI for even more code comprehension capabilities!
          </p>
        </Section>

        <Section title="💼 Perfect for:">
          <ul className="list-disc pl-5 space-y-2">
            <li>Developers exploring new projects 👨‍💻👩‍💻</li>
            <li>Code reviewers seeking quick understanding 🕵️‍♂️🕵️‍♀️</li>
            <li>Students learning from real-world codebases 🎓</li>
            <li>Tech leads evaluating potential dependencies 📈</li>
            <li>
              Anyone curious about how popular projects are structured! 🌍
            </li>
          </ul>
        </Section>

        <p className="text-center text-lg font-semibold mt-6">
          Experience the future of code comprehension with CContext-GitHub -
          where AI meets open-source exploration! 🚀🔍
        </p>
      </div>
    </motion.div>
  );
};

const Section: React.FC<{
  title: string;
  content?: string;
  children?: React.ReactNode;
}> = ({ title, content, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow">
    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
      {title}
    </h3>
    {content && <p className="text-gray-600 dark:text-gray-300">{content}</p>}
    {children}
  </div>
);

export default EnhancedCContextExplanation;
