import { VideoFeedPage } from "@/components/videos/VideoFeedPage";

export const metadata = {
  title: "Video Library | PharmPaper",
  description: "Explore hundreds of HD pharmacy lectures and tutorials.",
};

export default function FeedPage() {
  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <VideoFeedPage />
    </div>
  );
}
