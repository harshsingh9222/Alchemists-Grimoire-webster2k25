import { Heart, Github, Twitter, Linkedin, Mail } from "lucide-react";
import logo from "../assets/Images/cure_it_logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: "GitHub", icon: Github, href: "https://github.com/Animesh-Maurya" },
    { name: "Twitter", icon: Twitter, href: "https://x.com/home" },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: "https://www.linkedin.com/in/animesh-maurya-7b7b38346/",
    },
  ];

  return (
    <footer className="bg-gradient-to-b from-[#1a002f] to-[#2a004d] text-gray-300 border-t border-purple-900/40">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10 flex flex-col items-center text-center space-y-6">
        {/* Brand Section */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-pink-500/30">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-pink-500/30 bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
              <img
                src={logo}
                alt="Cure It Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <span className="text-2xl font-bold text-white">Cure It</span>
        </div>

        {/* Description */}
        <p className="text-gray-400 max-w-lg leading-relaxed">
          Empowering your wellness journey with smart technology 💊.
          <br />
          Schedule medicines, track doses, and let AI assist your care.
        </p>

        {/* Social Links */}
        <div className="flex space-x-5 mt-3">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center transition transform hover:scale-110 hover:shadow-pink-500/30 shadow-md"
                aria-label={social.name}
              >
                <Icon className="w-5 h-5 text-pink-400" />
              </a>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-full border-t border-purple-900/40 my-6" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full text-sm text-gray-400">
          <div className="flex items-center justify-center space-x-1 mb-2 md:mb-0">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span>
              by the{" "}
              <span className="text-pink-400 font-semibold">Cure It</span> team
            </span>
          </div>
          <div>
            © {currentYear}{" "}
            <span className="text-pink-400 font-semibold">Cure It</span>. All
            rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
