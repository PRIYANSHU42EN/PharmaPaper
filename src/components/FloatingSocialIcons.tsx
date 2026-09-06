import { Send, MessageCircle } from "lucide-react";

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function FloatingSocialIcons() {
  const SOCIAL_LINKS = [
    {
      name: "Telegram Channel",
      icon: Send,
      href: "https://t.me/pharmapaper",
      bgColor: "bg-[#229ED9]",
      hoverColor: "hover:bg-[#1b85b8]",
    },
    {
      name: "WhatsApp Community",
      icon: MessageCircle,
      href: "https://whatsapp.com/channel/0029Vb8NlDIJpe8gxELnuq3R",
      bgColor: "bg-[#25D366]",
      hoverColor: "hover:bg-[#20ba59]",
    },
    {
      name: "YouTube Channel",
      icon: YoutubeIcon,
      href: "https://youtube.com/@pharmapaper",
      bgColor: "bg-[#FF0000]",
      hoverColor: "hover:bg-[#cc0000]",
    },
  ];

  return (
    <aside 
      aria-label="Social media community links"
      className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3"
    >
      {SOCIAL_LINKS.map((item) => (
        <a
          key={item.name}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          title={item.name}
          aria-label={item.name}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${item.bgColor} ${item.hoverColor} text-white flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95`}
        >
          <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </a>
      ))}
    </aside>
  );
}
