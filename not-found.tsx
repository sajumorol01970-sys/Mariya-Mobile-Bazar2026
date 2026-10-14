import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="text-center">
        <p className="text-5xl font-black text-[#d81f26]">404</p>
        <h1 className="mt-3 text-lg font-extrabold">
          পেজটি পাওয়া যায়নি / Page not found
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          আপনি যে পেজটি খুঁজছেন তা সরানো হয়েছে বা লিংকটি ভুল।
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-primary">
            হোম / Home
          </Link>
          <Link href="/products" className="btn-outline">
            প্রোডাক্ট / Products
          </Link>
        </div>
      </div>
    </div>
  );
}
