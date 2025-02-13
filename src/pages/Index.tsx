import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ChevronRight, LineChart, Lock, Settings } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Advanced Meta Ads Management{" "}
              <span className="gradient-text">Made Simple</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Unlock the full potential of your Meta Ad campaigns with our advanced
              management platform. Access exclusive API settings through an
              intuitive interface.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button
                size="lg"
                className="button-hover bg-brand-600 hover:bg-brand-700"
              >
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="link" className="text-sm">
                Learn more <span aria-hidden="true">→</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to optimize your campaigns
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Access advanced features and settings previously only available
              through direct API integration.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-7xl sm:mt-20 lg:mt-24">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
              {features.map((feature) => (
                <Card
                  key={feature.name}
                  className="hover-card relative p-6 bg-white/50 backdrop-blur-sm"
                >
                  <dt className="text-base font-semibold leading-7">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                      <feature.icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </dd>
                </Card>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    name: "Advanced Campaign Settings",
    description:
      "Access API-exclusive settings and optimization options unavailable in the standard Meta Ads Manager interface.",
    icon: Settings,
  },
  {
    name: "Secure Authentication",
    description:
      "Enterprise-grade security with Meta Business OAuth 2.0 integration for safe and compliant access.",
    icon: Lock,
  },
  {
    name: "Performance Analytics",
    description:
      "Comprehensive analytics and reporting tools to track and optimize your campaign performance.",
    icon: LineChart,
  },
];

export default Index;
