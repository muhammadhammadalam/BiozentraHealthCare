import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent" | "warning";
  delay?: number;
}

const variantStyles = {
  default: "bg-card border border-border",
  primary: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
  accent: "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground",
  warning: "bg-gradient-to-br from-warning to-warning/80 text-warning-foreground",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  primary: "bg-primary-foreground/20 text-primary-foreground",
  accent: "bg-accent-foreground/20 text-accent-foreground",
  warning: "bg-warning-foreground/20 text-warning-foreground",
};

export function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = "default",
  delay = 0 
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-xl p-6 shadow-card transition-shadow hover:shadow-lg",
        variantStyles[variant]
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-current opacity-5" />
      
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium",
            variant === "default" ? "text-muted-foreground" : "opacity-80"
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              <span className={cn(
                "font-medium",
                trend.isPositive 
                  ? variant === "default" ? "text-success" : "opacity-90" 
                  : variant === "default" ? "text-destructive" : "opacity-90"
              )}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className={variant === "default" ? "text-muted-foreground" : "opacity-70"}>
                vs last month
              </span>
            </div>
          )}
        </div>
        
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn(
            "rounded-xl p-3",
            iconVariantStyles[variant]
          )}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
      </div>
    </motion.div>
  );
}
