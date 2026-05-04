export type ContactFaqItem = {
  question: string;
  answer: string;
};

export const CONTACT_FAQS: ContactFaqItem[] = [
  {
    question: "Which browser should I use for the best experience?",
    answer:
      "For the best experience, we recommend using Google Chrome. The website may also work in other browsers, but some features may behave differently.",
  },
  {
    question: "The website is not loading properly. What should I do?",
    answer:
      "Try refreshing the page, closing and reopening your browser, or clearing your browser cache. If the issue continues, please contact us for support.",
  },
  {
    question: "I am having trouble signing in. What should I do?",
    answer:
      "Please check that you are using the correct email and password. If the issue continues, contact support so we can help you access your account.",
  },
  {
    question: "I cannot open a document or PDF. What should I do?",
    answer:
      "Most documents can be opened directly in your browser. If a file does not open, try using Google Chrome, Microsoft Edge, or Adobe Acrobat Reader.",
  },
  {
    question: "Do I need to pay to view uploaded documents?",
    answer:
      "No. You should not need to pay to view documents submitted through this website. Please be careful of pop-ups or third-party services asking for payment.",
  },
  {
    question: "How can I save this website for later?",
    answer:
      "You can bookmark the website in your browser so it is easier to return to later.",
  },
  {
    question: "Can I submit feedback or suggestions?",
    answer:
      "Yes. Survivors, families, and community members are welcome to share questions, comments, or suggestions to help improve the website.",
  },
  {
    question: "What details should I include when reporting a problem?",
    answer:
      "Please include what you were trying to do, what device or browser you were using, and what happened on the screen.",
  },
  {
    question: "Can I suggest changes to wording, language, colours, or layout?",
    answer:
      "Yes. Feedback about wording, accessibility, language, colour coding, and layout is welcome.",
  },
  {
    question: "Who can I contact if I need help?",
    answer:
      "Please use the contact or feedback section on the website, and someone from the team will follow up with you.",
  },
];
