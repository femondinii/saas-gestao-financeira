import React from "react";
import { Button } from "../ui/Button.jsx";

export default function SocialOAuthRow({ onGoogle }) {
    return (
        <>
            <div className="flex items-center gap-3 my-4">
                <hr className="flex-1 border-gray-200 dark:border-neutral-800" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                Ou continue com
                </span>
                <hr className="flex-1 border-gray-200 dark:border-neutral-800" />
            </div>
            <Button type="button" variant="outline" onClick={onGoogle}>
                <span className="inline-flex items-center gap-3 justify-center">
                <img
                    alt="Google"
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    className="w-5 h-5"
                />
                <span>Google</span>
                </span>
            </Button>
        </>
    );
}
