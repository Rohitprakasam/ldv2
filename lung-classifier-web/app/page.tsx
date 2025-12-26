import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative w-full h-screen bg-[#121212] text-white overflow-hidden flex flex-col items-center justify-center">

      {/* Navigation Overlay */}
      <nav className="absolute top-0 right-0 p-8 z-50">
        <Link
          href="/class"
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-green-400 text-black font-bold rounded-full hover:scale-105 transition-transform"
        >
          Try Classifier
        </Link>
      </nav>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center justify-center text-center p-10">

        {/* Text Content */}
        <div className="z-20">
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse">
            Sriharshini Sudhakaran
          </h1>
          <p className="text-2xl text-gray-300 mb-4">
            Pre-Final Year Student
          </p>
          <p className="text-xl text-gray-400">
            Sri Sairam Institute of Technology
          </p>
        </div>
      </div>
    </main>
  );
}
