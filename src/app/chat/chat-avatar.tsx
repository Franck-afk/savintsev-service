import Image from "next/image";

export function ChatAvatar({
  src, name, className = "size-10",
}: {
  src: string | null | undefined;
  name: string | null;
  className?: string;
}) {
  const initials = (name || "?")[0].toUpperCase();
  return (
    <div className={`relative shrink-0 ${className}`}>
      {src ? (
        <Image src={src} alt="" fill className="rounded-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
          {initials}
        </div>
      )}
    </div>
  );
}
