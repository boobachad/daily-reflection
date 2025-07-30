"use client";

import React, { useState, useEffect } from "react";
import { Code, Database, GitBranch, Trophy, Zap, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoadingStep {
    id: string;
    label: string;
    icon: React.ReactNode;
    status: 'pending' | 'loading' | 'complete';
}

interface HeatmapLoadingStateProps {
    onComplete?: () => void;
    totalDuration?: number; // Total loading duration in milliseconds
}

export const HeatmapLoadingState = ({ onComplete, totalDuration = 10000 }: HeatmapLoadingStateProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    // Define steps - each gets equal duration
    const stepDefinitions: Omit<LoadingStep, 'status'>[] = [
        {
            id: 'config',
            label: 'Validating environment credentials...',
            icon: <CheckCircle className="h-4 w-4" />
        },
        {
            id: 'github',
            label: 'Connecting to GitHub API...',
            icon: <GitBranch className="h-4 w-4" />
        },
        {
            id: 'leetcode',
            label: 'Fetching LeetCode submissions...',
            icon: <Code className="h-4 w-4" />
        },
        {
            id: 'productivity',
            label: 'Loading productivity metrics...',
            icon: <Database className="h-4 w-4" />
        },
        {
            id: 'processing',
            label: 'Analyzing activity patterns...',
            icon: <Zap className="h-4 w-4" />
        },
        {
            id: 'generating',
            label: 'Rendering interactive heatmap...',
            icon: <Trophy className="h-4 w-4" />
        }
    ];

    // Calculate equal duration for each step
    const stepDuration = Math.round(totalDuration / stepDefinitions.length);
    const [steps, setSteps] = useState<LoadingStep[]>(
        stepDefinitions.map(step => ({
            ...step,
            status: 'pending' as const
        }))
    );

    useEffect(() => {
        const processSteps = async () => {
            for (let i = 0; i < steps.length; i++) {
                // Set current step to loading
                setSteps(prev => prev.map((step, index) => ({
                    ...step,
                    status: index === i ? 'loading' : index < i ? 'complete' : 'pending'
                })));
                setCurrentStep(i);

                // Wait for equal step duration
                await new Promise(resolve => setTimeout(resolve, stepDuration));

                // Mark step as complete
                setSteps(prev => prev.map((step, index) => ({
                    ...step,
                    status: index <= i ? 'complete' : 'pending'
                })));
            }

            // Mark as fully complete
            setIsComplete(true);

            // Call onComplete callback if provided
            if (onComplete) {
                setTimeout(onComplete, 300);
            }
        };

        processSteps();
    }, [onComplete, stepDuration]);

    const getStatusIcon = (step: LoadingStep) => {
        switch (step.status) {
            case 'complete':
                return <CheckCircle className="h-4 w-4 text-primary" />;
            case 'loading':
                return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
            default:
                return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
        }
    };

    const getProgressPercentage = () => {
        const completedSteps = steps.filter(step => step.status === 'complete').length;
        return (completedSteps / steps.length) * 100;
    };

    return (
        <div className="w-full flex justify-center">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center pb-4">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 mx-auto">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
                        <div className="relative w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                            <Zap className="h-6 w-6 text-primary-foreground animate-pulse" />
                        </div>
                    </div>
                    <CardTitle className="text-xl mb-2">
                        🚀 Initializing Activity Dashboard
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Gathering your coding journey from multiple platforms...
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-foreground">
                                📊 DATA SYNC STATUS
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {Math.round(getProgressPercentage())}% COMPLETE
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${getProgressPercentage()}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Loading Steps */}
                    <div className="space-y-3">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-300 ${step.status === 'loading'
                                    ? 'bg-primary/5 border-primary/20'
                                    : step.status === 'complete'
                                        ? 'bg-primary/5 border-primary/20'
                                        : 'bg-muted/50 border-border'
                                    }`}
                            >
                                {/* Status Icon */}
                                <div className="flex-shrink-0">
                                    {getStatusIcon(step)}
                                </div>

                                {/* Step Icon */}
                                <div className={`flex-shrink-0 p-2 rounded-lg border ${step.status === 'loading' || step.status === 'complete'
                                    ? 'bg-primary/10 border-primary/20 text-primary'
                                    : 'bg-muted border-border text-muted-foreground'
                                    }`}>
                                    {step.icon}
                                </div>

                                {/* Step Label */}
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${step.status === 'loading' || step.status === 'complete'
                                        ? 'text-foreground'
                                        : 'text-muted-foreground'
                                        }`}>
                                        {step.label}
                                    </p>
                                </div>

                                {/* Loading Animation for Current Step */}
                                {step.status === 'loading' && (
                                    <div className="flex space-x-1">
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Skeleton Heatmap Preview */}
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="text-center mb-4">
                            <div className="h-4 bg-muted animate-pulse mx-auto w-32 mb-2 rounded"></div>
                            <div className="h-3 bg-muted animate-pulse mx-auto w-48 rounded"></div>
                            <div className="text-xs text-muted-foreground mt-2">
                                [ BUILDING ACTIVITY GRID... ]
                            </div>
                        </div>

                        {/* Skeleton Grid */}
                        <div className="grid grid-cols-12 gap-1 max-w-md mx-auto">
                            {Array.from({ length: 84 }, (_, i) => (
                                <div
                                    key={i}
                                    className="w-3 h-3 bg-muted animate-pulse rounded"
                                    style={{
                                        animationDelay: `${i * 15}ms`,
                                        animationDuration: '1.2s'
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Message */}
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                            {isComplete
                                ? "✨ Dashboard ready! Your coding journey awaits."
                                : "⚡ Assembling your digital achievements... Almost there!"
                            }
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};