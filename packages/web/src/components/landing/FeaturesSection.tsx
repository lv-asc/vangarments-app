// @ts-nocheck
'use client';

import { motion } from 'framer-motion';
import {
  CameraIcon,
  SparklesIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Smart Cataloging',
    description: 'Advanced AI automatically identifies your pieces, colors, materials and categories following the VUFS standard.',
    icon: CameraIcon,
    color: 'from-[#00132d] to-[#00132d]/80',
  },
  {
    name: 'Automatic Styling',
    description: 'Receive personalized outfit suggestions based on your wardrobe, occasion and preferences.',
    icon: SparklesIcon,
    color: 'from-[#00132d]/80 to-[#00132d]/60',
  },
  {
    name: 'Fashion Social Network',
    description: 'Share your looks, discover trends and connect with other fashion enthusiasts.',
    icon: UserGroupIcon,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Integrated Marketplace',
    description: 'Sell pieces you no longer use and discover unique items from other users and partner brands.',
    icon: ShoppingBagIcon,
    color: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Style Analytics',
    description: 'Understand your consumption habits, most worn pieces and optimize your wardrobe.',
    icon: ChartBarIcon,
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'Guaranteed Privacy',
    description: 'Your data is protected with advanced encryption and full compliance with data protection regulations.',
    icon: ShieldCheckIcon,
    color: 'from-gray-500 to-slate-500',
  },
];

export function FeaturesSection() {
  return (
    <div id="features" className="py-24 bg-white sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-[#00132d]">
            Innovative Features
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to revolutionize your wardrobe
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our platform combines artificial intelligence, social networking and marketplace
            to create the most complete fashion experience.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}