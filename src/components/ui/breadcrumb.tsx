"use client";
import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type BreadcrumbItem = {
  label: string;
  href: string;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm font-medium text-gray-500", className)}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            <Link href={item.href} className="hover:text-gray-900 hover:underline">
              {item.label}
            </Link>
            {index < items.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
