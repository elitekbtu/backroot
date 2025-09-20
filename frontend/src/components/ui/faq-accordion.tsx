import { useState } from 'react';
import { PlusIcon } from 'lucide-react';

const faqData = [
  {
    question: "What is Back2Roots?",
    answer: "An innovative travel platform that helps people explore Astana in a new way — through hidden gems, authentic places, and cultural experiences. Back2Roots is an innovative tourism project that reimagines the way people explore Astana. It is not just about visiting popular landmarks, but about uncovering hidden gems, rare places, and unique cultural experiences that reveal the city's authentic spirit."
  },
  {
    question: "Our Difference",
    answer: "We combine personalized AI-powered assistant and trip navigation with AR technology to create a unique exploration experience that goes beyond traditional tourism."
  },
  {
    question: "What We Offer",
    answer: "AsylAI – your personal AI guidance for exploring Astana which is available 24/7\n📍 Discovery of hidden attractions and local gems\n🪙 AR Coin Collection with Qar Barysy\n🤝 Direct support for local businesses"
  },
  {
    question: "Benefits",
    answer: "Discover more of Astana, play while you explore, and contribute to preserving culture and boosting local commerce. The platform acts as an extraordinary tool for both locals and travelers, guiding them beyond the usual routes and helping them connect with Astana's history, culture, and modern lifestyle in new and exciting ways."
  },
  {
    question: "Who We Are",
    answer: "We are a passionate team building a new way to experience travel in Astana — where technology meets culture. Our mission is to make exploring Astana effortless and exciting by helping tourists discover hidden cultural and commercial attractions, while also giving local businesses innovative ways to connect with visitors."
  }
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {faqData.map((item, index) => (
        <div key={index} className="border-b border-gray-200">
          <button
            className="w-full flex items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            onClick={() => toggleAccordion(index)}
          >
            <span className="font-medium text-gray-900">{item.question}</span>
            <PlusIcon 
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                openIndex === index ? 'rotate-45' : ''
              }`} 
            />
          </button>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="p-4 bg-white text-gray-600 whitespace-pre-line">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}