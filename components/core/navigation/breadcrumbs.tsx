"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import Link from "next/link";
import { Fragment } from "react";

type BreadcrumbItem = {
  title: string
  link: string
}

export function Breadcrumbs() {
  const items = useBreadcrumbs();
  if (items.length === 0) return null;
  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList className="text-sm">
        {items.map((item: BreadcrumbItem, index: number) => (
          <Fragment key={item.title}>
            {index !== items.length - 1 && (
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild
                >
                  <Link href={`${item.link}`}>{item.title}</Link>

                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
            {index < items.length - 1 && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
            {index === items.length - 1 && (
              <BreadcrumbPage>{item.title}</BreadcrumbPage>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
