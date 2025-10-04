import React from "react";
import { Card, CardBody } from "../ui/Card.jsx";
import AuthHeader from "./AuthHeader";

export default function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="min-h-dvh bg-gray-50 text-gray-900 dark:bg-neutral-900 dark:text-gray-100 flex">
            <div className="w-full flex items-center justify-center px-4 sm:px-6 py-6">
                <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg">
                    <CardBody>
                        <AuthHeader title={title} subtitle={subtitle} />
                        {children}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
