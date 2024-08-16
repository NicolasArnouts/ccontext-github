CContext GitHub
CContext GitHub is a powerful web application that allows users to clone GitHub repositories, run CContext commands, and chat with an AI about the generated content. This tool is designed to streamline the process of analyzing and understanding codebases, making it an invaluable resource for developers, code reviewers, and anyone interested in exploring GitHub projects.
Features

GitHub Repository Integration: Easily clone and analyze any public GitHub repository.
CContext Command Execution: Run CContext commands on the cloned repositories to generate insightful reports.
AI-Powered Chat Interface: Engage in conversations with an AI about the generated content, asking questions and gaining deeper insights into the codebase.
File Tree Visualization: View the structure of the analyzed repository through an interactive file tree.
Markdown and PDF Output: Generate and download reports in both Markdown and PDF formats.
User Authentication: Secure user accounts powered by Clerk for managing personal repositories and analysis history.
Dark Mode Support: Toggle between light and dark themes for comfortable viewing in any environment.

Getting Started
Prerequisites

Node.js (v14 or later)
npm or yarn
PostgreSQL database

Installation

Clone the repository:
Copygit clone https://github.com/yourusername/ccontext-github.git
cd ccontext-github

Install dependencies:
Copynpm install

Set up environment variables:
Create a .env.local file in the root directory and add the following variables:
CopyDATABASE_URL=your_postgresql_database_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

Run database migrations:
Copynpx prisma migrate dev

Start the development server:
Copynpm run dev

Open http://localhost:3000 in your browser to see the application.

Usage

Sign in using your Clerk account.
Enter a GitHub repository URL in the input field.
Specify the CContext command you want to run.
Click "Clone and Run CContext" to analyze the repository.
View the generated output, file tree, and download options.
Use the chat interface to ask questions about the analyzed codebase.

Contributing
We welcome contributions to the CContext GitHub project! Please follow these steps to contribute:

Fork the repository.
Create a new branch for your feature or bug fix.
Make your changes and commit them with descriptive commit messages.
Push your changes to your fork.
Submit a pull request to the main repository.

Please ensure that your code follows the existing style conventions and includes appropriate tests.
License
This project is licensed under the MIT License - see the LICENSE file for details.
Acknowledgments

Next.js for the React framework
Clerk for authentication
Prisma for database ORM
Tailwind CSS for styling
Vercel for hosting and deployment

Support
If you encounter any issues or have questions, please file an issue on the GitHub repository or contact the maintainers directly.
