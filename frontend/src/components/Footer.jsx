import { Link } from 'react-router-dom';

export default function Footer() {
  const handleScrollToStory = (e) => {
    e.preventDefault();
    document.getElementById("brand-story")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-[#09090A] border-t border-zinc-950 pt-10 pb-28 md:pb-12 px-4 text-center select-none font-sans">
      <div className="max-w-xl mx-auto flex flex-col items-center">
        
        {/* Section 1: Centralized Lowercase Brand Story Overlay */}
        <p 
          id="brand-story" 
          className="font-serif italic text-zinc-400 text-sm max-w-md mx-auto mb-6 tracking-wide leading-relaxed"
        >
          creationhub — elevating your everyday tech lifestyle through curated premium gear.
        </p>

        {/* Section 2: Flat Centered Action Anchors Row */}
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-[11px] font-medium tracking-widest uppercase mb-6 text-zinc-500">
          <a 
            href="#brand-story" 
            onClick={handleScrollToStory}
            className="hover:text-white transition-colors duration-200 cursor-pointer"
          >
            About Brand
          </a>
          <Link 
            to="/orders" 
            className="hover:text-white transition-colors duration-200"
          >
            My Orders
          </Link>
          <Link 
            to="/cart" 
            className="hover:text-white transition-colors duration-200"
          >
            Shopping Bag
          </Link>
        </div>

        {/* Section 3: Fine-line Micro Copyright Text */}
        <p className="text-[10px] tracking-wider text-zinc-600">
          &copy; {new Date().getFullYear()} CREATIONHUB. ALL RIGHTS RESERVED.
        </p>

      </div>
    </footer>
  );
}
