import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="border-b p-4 flex items-center justify-between bg-background">
      <h2 className="font-semibold">Dashboard</h2>
      <Button variant="outline">Logout</Button>
    </header>
  );
}
