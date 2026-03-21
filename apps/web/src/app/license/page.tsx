import { Metadata } from "next";

export const metadata: Metadata = {
  title: "License — PixelStock",
  description: "PixelStock photo and video license — free for commercial and personal use.",
};

export default function LicensePage() {
  return (
    <div className="container-app py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-hero text-surface-900 mb-4">PixelStock License</h1>
        <p className="text-body text-surface-500 mb-12">Simple, permissive, free for everyone.</p>

        <div className="bg-brand/5 border border-brand/20 rounded-2xl p-6 sm:p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-title text-surface-900 mb-2">All photos and videos on PixelStock are free to use.</h2>
              <p className="text-body text-surface-600">Attribution is not required. Giving credit to the photographer or PixelStock is appreciated but not mandatory.</p>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-title text-surface-900">What is allowed?</h2>
            </div>
            <ul className="space-y-3 text-body text-surface-600 ml-11">
              <li>All photos and videos on PixelStock can be downloaded and used for free.</li>
              <li>Commercial and non-commercial purposes.</li>
              <li>No permission needed (though attribution is appreciated!).</li>
            </ul>
          </section>

          <div className="divider" />

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-danger-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-title text-surface-900">What is not allowed?</h2>
            </div>
            <ul className="space-y-3 text-body text-surface-600 ml-11">
              <li>Identifiable people may not be used in a way that is offensive or portrays them negatively.</li>
              <li>Don&apos;t sell unaltered copies of a photo or video.</li>
              <li>Don&apos;t imply endorsement of your product by people or brands on the imagery.</li>
              <li>Don&apos;t redistribute or sell the photos and videos on other stock photo or wallpaper platforms.</li>
              <li>Don&apos;t use the photos or videos as part of AI training datasets.</li>
            </ul>
          </section>

          <div className="divider" />

          <section>
            <h2 className="text-title text-surface-900 mb-3">Long version</h2>
            <p className="text-body text-surface-600 leading-relaxed">
              PixelStock grants you an irrevocable, nonexclusive, worldwide copyright
              license to download, copy, modify, distribute, perform, and use photos
              and videos from PixelStock for free, including for commercial purposes,
              without permission from or attributing the photographer or PixelStock.
              This license does not include the right to compile photos or videos from
              PixelStock to replicate a similar or competing service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
