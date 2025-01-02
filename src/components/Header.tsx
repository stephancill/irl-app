import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

interface HeaderProps {
  showBackButton?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function Header({
  showBackButton = false,
  children,
  onClick,
}: HeaderProps) {
  const router = useRouter();

  return (
    <div
      className="sticky top-0 bg-background z-50 p-4 border-b max-w-[400px] mx-auto w-full"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center justify-between w-full">
          <Logo />
          {children}
        </div>
      </div>
    </div>
  );
}
