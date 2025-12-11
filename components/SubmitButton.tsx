import React from 'react';
import {Button} from "@/components/ui/button";
import Image from "next/image";

interface ButtonProps {
    isLoading: boolean;
    classname?: string;
    children?: React.ReactNode;
}

const SubmitButton = ( {isLoading, classname, children} : ButtonProps) => {
    return (
        <Button type='submit' disabled={isLoading} className={classname ?? 'shadow-primary-btn w-full'}>
            {isLoading ? (
                <div className='flex items-center gap-4'>
                    <Image
                        src='/assets/icons/loader.svg'
                        alt='loader'
                        height={24}
                        width={24}
                        className='animate-spin'
                    />
                    Loading...
                </div>
            ) : children}
        </Button>
    );
}

export default SubmitButton;