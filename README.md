# 🚀 GitHub CContext

Supercharge your GitHub exploration with AI-powered insights! 🧠💡

Chat with any GitHub Codebase!

Live demo: [https://ghccontext.t3chnico.com/](https://ghccontext.t3chnico.com/)

## 🌟 Features

- 🔍 Clone and analyze any public GitHub repository
- 🤖 Run CContext commands for in-depth code analysis
- 💬 Chat with AI about the generated content
- 🌳 Interactive file tree visualization
- 📊 Markdown and PDF report generation
- 🔐 Secure user authentication with Clerk
- 💰 Token system with free and premium models
- 💳 Stripe integration for token purchases
- 🌓 Dark mode support for comfortable viewing

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- PostgreSQL database
- Stripe account for payment processing
- Clerk account for authentication
- OpenAI API key

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/NicolasArnoutsHoGent/ccontext-github.git
   cd ccontext-github
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:

   ```
   DATABASE_URL=your_postgresql_database_url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   STRIPE_API_KEY=your_stripe_api_key
   NEXT_PUBLIC_APP_URL=your_app_url
   OPENAI_API_KEY=your_openai_api_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   TEMP_ENV_BASE_DIR=/path/to/temp_environments
   ```

4. Run database migrations:

   ```
   npx prisma migrate dev
   ```

5. Seed the database with initial data:

   ```
   npm run db:seed
   ```

6. Start the development server:

   ```
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🧑‍💻 Usage

1. Sign in using your Clerk account or continue as an anonymous user
2. Enter a GitHub repository URL
3. Click "Clone Repository" to analyze the repository
4. Explore the generated output, file tree, and download options
5. Use the chat interface to ask questions about the analyzed codebase

## 💰 Token System

- Users start with a free allocation of tokens
- Different models have varying token costs
- Premium models offer advanced features and higher token limits
- Tokens can be purchased through the integrated Stripe payment system

## 🛠️ Tech Stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Clerk Authentication
- Stripe Payment Integration
- OpenAI API

## 🚀 Deployment

The application is currently deployed and running at [https://ghccontext.t3chnico.com/](https://ghccontext.t3chnico.com/)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

Please ensure your code follows the existing style conventions and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js for the React framework
- Clerk for authentication
- Prisma for database ORM
- Tailwind CSS for styling
- Vercel for hosting and deployment
- OpenAI for AI capabilities
- Stripe for payment processing

## 📞 Support

If you encounter any issues or have questions, please file an issue on the GitHub repository or contact the maintainers directly.

---

Built with ❤️ by Nicolas Arnouts
