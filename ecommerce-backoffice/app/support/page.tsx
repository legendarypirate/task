import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Дэмжлэг",
  description:
    "Даалгаварын системийн хэрэглэгчийн дэмжлэг — холбоо барих утас болон и-мэйл.",
};

const PHONE_DISPLAY = "+976 9907 2454";
const PHONE_E164 = "+97699072454";
const EMAIL = "taskmanager@gmail.com";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Дэмжлэг
          </h1>
          <p className="mt-3 text-muted-foreground">
            Асуулт, алдааны мэдэгдэл эсвэл санал хүсэлтээ доорх сувгуудаар илгээнэ үү.
          </p>
        </header>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <ul className="space-y-8">
            <li className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Phone className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Утас</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Даваа–Баасан, 09:00–18:00 (Улаанбаатар цаг)
                </p>
                <a
                  href={`tel:${PHONE_E164}`}
                  className="mt-2 inline-block text-lg font-medium text-primary underline-offset-4 hover:underline"
                >
                  {PHONE_DISPLAY}
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">И-мэйл</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Хариу өгөх хугацаа: ажлын 1–2 өдөр
                </p>
                <a
                  href={`mailto:${EMAIL}`}
                  className="mt-2 inline-block break-all text-lg font-medium text-primary underline-offset-4 hover:underline"
                >
                  {EMAIL}
                </a>
              </div>
            </li>
          </ul>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary underline-offset-4 hover:underline">
            Нүүр хуудас
          </Link>
          {" · "}
          <Link
            href="/privacy"
            className="text-primary underline-offset-4 hover:underline"
          >
            Нууцлалын бодлого
          </Link>
        </p>
      </div>
    </div>
  );
}
