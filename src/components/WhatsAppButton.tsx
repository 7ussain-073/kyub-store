import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/9647728157639"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-primary-foreground shadow-lg transition-transform hover:scale-110 animate-float"
      aria-label="تواصل عبر التلغرام"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
