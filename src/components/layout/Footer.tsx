export function Footer() {
  return (
    <div className="mt-8 text-center text-muted-foreground text-sm">
      <p>&copy; 2025 InterviewCoach AI. All rights reserved.</p>
      <p>
        Built with ❤️ by{" "}
        <a
          className="text-foreground hover:underline"
          href="https://www.linkedin.com/in/siddhesh-shirdhankar-8024871a7/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Siddhesh Shirdhankar
        </a>
        . Check out the{" "}
        <a
          href="https://github.com/Sid-1819/interview-coach-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:underline"
        >
          GitHub repo
        </a>{" "}
        for more info.
      </p>
    </div>
  );
}
