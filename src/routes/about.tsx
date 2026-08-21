import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout, SectionTitle } from "@/components/PublicLayout";
import { fetchSettings } from "@/lib/queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমাদের সম্পর্কে — MOHAKAL TELEVISION" },
      {
        name: "description",
        content: "MOHAKAL TELEVISION একটি বাংলা অনলাইন সংবাদমাধ্যম। আমাদের লক্ষ্য ও পরিচিতি জানুন।",
      },
      { property: "og:title", content: "আমাদের সম্পর্কে — MOHAKAL TELEVISION" },
      {
        property: "og:description",
        content: "MOHAKAL TELEVISION-এর লক্ষ্য, উদ্দেশ্য ও পরিচিতি।",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings() });

  return (
    <PublicLayout>
      <SectionTitle>আমাদের সম্পর্কে</SectionTitle>
      <div className="news-body max-w-3xl">
        {data?.about_text ? (
          data.about_text
        ) : (
          <>
            <p>
              MOHAKAL TELEVISION একটি বাংলা ভাষার অনলাইন সংবাদমাধ্যম। সারা দেশের প্রতিনিধিদের
              মাধ্যমে সংগৃহীত সংবাদ যাচাই-বাছাই করে আমরা পাঠকের কাছে পৌঁছে দিই।
            </p>
            <p>
              আমাদের অঙ্গীকার — নির্ভুল, নিরপেক্ষ ও দ্রুত সংবাদ পরিবেশন। জাতীয়, আন্তর্জাতিক,
              রাজনীতি, শিক্ষা, ধর্ম, খেলাধুলা ও জেলার সংবাদ আমাদের নিয়মিত আয়োজন।
            </p>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
