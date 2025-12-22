import React from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Brain,
  Users,
  FileText,
  ArrowRight,
} from "lucide-react";
const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "Get intelligent feedback  your documents  AI-driven  and suggestions.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Seamlessly collaborate with  team members and track project progress  in a real-time.",
  },
  {
    icon: FileText,
    title: "Document Management",
    description: "Organize in one centralized location.",
  },
];

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
      <Icon className="h-6 w-6 text-blue-600" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <header className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white/20 backdrop-blur-lg rounded-2xl">
                <GraduationCap className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Milesto
              <span className="block text-2xl md:text-3xl font-normal text-blue-100 mt-2">
                AI-Powered Project Tracker
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Stream project with intelligent document analysis, seamless team
              collaboration, and AI-driven insights that the project success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need for Project Success
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From AI-powered document analysis to seamless team
                collaboration, Milesto provides all the tools need to excel in
                your project.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
