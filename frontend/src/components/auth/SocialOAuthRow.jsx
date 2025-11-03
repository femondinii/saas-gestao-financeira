import React from "react";
import { Button } from "../ui/Button.jsx";

export default function SocialOAuthRow({ onGoogle }) {
    return (
        <>
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
