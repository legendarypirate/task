"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Navbar() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <>
      <header className="border-b p-4 flex items-center justify-between bg-background">
        <h2 className="font-semibold">Хянах самбар</h2>
        <Button variant="outline" onClick={() => setShowLogoutDialog(true)}>
          Logout
        </Button>
      </header>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Гарах уу?</DialogTitle>
            <DialogDescription>
              Та системээс гарахдаа итгэлтэй байна уу?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Үгүй
            </Button>
            <Button onClick={handleLogout}>Тийм, гарах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
