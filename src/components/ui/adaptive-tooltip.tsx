"use client";

import * as React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";

interface AdaptiveTooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    className?: string;
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
    align?: "start" | "center" | "end";
}

export function AdaptiveTooltip({
    children,
    content,
    className,
    side = "top",
    sideOffset = 4,
    align = "center",
}: AdaptiveTooltipProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent
                    className={className}
                    side={side}
                    sideOffset={sideOffset}
                    align={align}>
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}