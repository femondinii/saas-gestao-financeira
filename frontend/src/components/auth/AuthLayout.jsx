import React from "react";
import { Card, CardBody } from "../ui/Card.jsx";
import AuthHeader from "./AuthHeader";

export default function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-900 dark:text-gray-100 flex">
        <div className="w-full flex items-center justify-center p-4">
            <Card className="w-full max-w-xl">
            <CardBody>
                <AuthHeader title={title} subtitle={subtitle} />
                {children}
            </CardBody>
            </Card>
        </div>
        </div>
  );
}
