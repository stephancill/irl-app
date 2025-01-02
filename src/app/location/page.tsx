"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ANCHOR_TIMEZONES, ANCHOR_TIMEZONES_LABELS } from "@/lib/constants";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "../../components/Logo";
import { Button } from "../../components/ui/button";
import { useToast } from "../../hooks/use-toast";

export default function Page() {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");

  const updateTimezone = useMutation({
    mutationFn: async (timezone: string) => {
      const response = await fetch("/api/user/timezone", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone }),
      });

      if (!response.ok) {
        throw new Error("Failed to update timezone");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "timezone updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update timezone",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDone = () => {
    if (selectedTimezone) {
      updateTimezone.mutate(selectedTimezone);
    }
    router.push("/");
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 bg-background z-50 p-4 border-b max-w-[400px] mx-auto w-full">
        <div className="flex items-center justify-between">
          <Logo />
        </div>
      </div>
      <div className="space-y-4 py-4 flex flex-col gap-4 max-w-[400px] mx-auto w-full">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle>update your location</CardTitle>
            <CardDescription>
              choose your timezone to receive notifications at the right time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={(value) => setSelectedTimezone(value)}
              disabled={updateTimezone.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
                {ANCHOR_TIMEZONES.map((timezone) => (
                  <SelectItem key={timezone} value={timezone}>
                    {
                      ANCHOR_TIMEZONES_LABELS[
                        timezone as keyof typeof ANCHOR_TIMEZONES_LABELS
                      ]
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button
            size={"lg"}
            className="px-4 flex-1"
            onClick={handleDone}
            disabled={!selectedTimezone || updateTimezone.isPending}
          >
            done
          </Button>
          <Button
            size={"lg"}
            className="px-4 flex-1"
            variant="outline"
            onClick={() => router.push("/")}
          >
            back
          </Button>
        </div>
      </div>
    </div>
  );
}
