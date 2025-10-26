import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

const cx = (...a) => a.filter(Boolean).join(" ");

export function StatsCard({
    title,
    value,
    description,
    icon,
    trend,
    percentage,
    valueClassName = "",
}) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-6">
                <div className="flex w-full items-center justify-between">
                    <CardTitle className="text-sm font-normal text-muted-foreground leading-none tracking-tight">
                        {title}
                    </CardTitle>
                    {icon && (
                        <div className="h-5 w-5 text-muted-foreground shrink-0 ml-2">
                            {icon}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className={`text-2xl font-bold ${valueClassName}`}>
                    {value || '—'}
                </div>
                {(description || percentage) && (
                    <div className="mt-1 flex items-center text-xs">
                        {trend && (
                            <span
                                className={cx(
                                    "mr-1",
                                    trend === "up" && "text-green-600 dark:text-green-500",
                                    trend === "down" && "text-red-600 dark:text-red-500"
                                )}
                            >
                                {trend === "up" ? "↑" : "↓"}
                            </span>
                        )}
                        {percentage && (
                            <span
                                className={cx(
                                    "mr-1 font-medium",
                                    trend === "up" && "text-green-600 dark:text-green-500",
                                    trend === "down" && "text-red-600 dark:text-red-500"
                                )}
                            >
                                {percentage}
                            </span>
                        )}
                        {description && (
                            <span className="text-muted-foreground">{description}</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
