# PDF Quiz Generator

This app generates quizzes from PDF documents using Google's Gemini AI.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file and set your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

1. Fork this repository to your GitHub account
2. Create a new project on [Vercel](https://vercel.com)
3. Import your forked repository
4. Set the following environment variables in your Vercel project settings:
   - `GEMINI_API_KEY`: Your Google Gemini API key
5. Deploy!

The app will be automatically built and deployed by Vercel.
