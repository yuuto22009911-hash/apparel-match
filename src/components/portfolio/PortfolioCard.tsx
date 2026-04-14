'use client';

import { Portfolio } from '@/lib/types';
import { PORTFOLIO_CATEGORIES } from '@/lib/constants';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from 'lucide-react';

interface PortfolioCardProps {
  portfolio: Portfolio;
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const categoryLabel =
    PORTFOLIO_CATEGORIES[portfolio.category as keyof typeof PORTFOLIO_CATEGORIES] ||
    portfolio.category ||
    'その他';

  const thumbnailUrl = portfolio.image_urls[0] || '/placeholder.jpg';

  return (
    <Link href={`/portfolio/${portfolio.id}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={portfolio.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Category Badge */}
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {categoryLabel}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2">
            {portfolio.title}
          </h3>

          {/* Tags */}
          {portfolio.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {portfolio.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-0.5 rounded text-xs bg-slate-50 text-slate-600"
                >
                  #{tag}
                </span>
              ))}
              {portfolio.tags.length > 2 && (
                <span className="inline-block px-2 py-0.5 text-xs text-slate-500">
                  +{portfolio.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Image Count */}
          <div className="mt-auto">
            <p className="text-xs text-slate-500">
              画像: {portfolio.image_urls.length}枚
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
