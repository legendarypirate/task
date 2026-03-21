"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // message state
  const [messageType, setMessageType] = useState<"error" | "success" | "info">("info");

  const handleLogin = async () => {
    setMessage(""); // clear previous messages
    if (!phone || !password) {
      setMessageType("error");
      setMessage("Утасны дугаар болон нууц үг оруулна уу");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.message || "Нэвтрэхэд алдаа гарлаа");
      } else {
        localStorage.setItem("token", data.token);
        setMessageType("success");
        setMessage("Амжилттай нэвтэрлээ");

        setTimeout(() => {
          window.location.href = "/admin"; // adjust to your protected page
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Серверийн алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const messageColor = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-gray-600",
  }[messageType];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-neutral-900 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">ӨГӨӨЖ ЧИХЭР БООВ</h1>
        
        </CardHeader>

   <CardContent className="space-y-4">

  <div className="w-full flex justify-center mb-4">
    <img
      src="/uguujlogo.png"
      alt="Uguuj Logo"
      className="w-32 h-auto object-contain"
    />
  </div>

  <div className="flex flex-col space-y-2">
    <Label htmlFor="phone">Утасны дугаар</Label>
    <Input
      id="phone"
      type="tel"
      placeholder="8800xxxx"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
    />
  </div>

  <div className="flex flex-col space-y-2">
    <Label htmlFor="password">Нууц үг</Label>
    <Input
      id="password"
      type="password"
      placeholder="••••••••"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
  </div>

  {message && <p className={`text-sm mt-1 ${messageColor}`}>{message}</p>}
</CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button
            className="w-full h-11 rounded-xl text-base font-medium"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
          </Button>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Бүртгэлгүй юу? <span className="underline cursor-pointer">Бүртгүүлэх</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
