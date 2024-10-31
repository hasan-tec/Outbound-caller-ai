'use client';

import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
} from '@headlessui/react';
import { FC } from 'react';

type Props = {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    children: React.ReactNode;
};

const Modal: FC<Props> = ({
    open,
    onClose,
    title,
    description,
    children,
}) => {
    return (
        <Dialog open={open} onClose={() => onClose()} className="relative z-10">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-lg transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 w-xl sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95 rounded-md bg-white"
                    >
                        <div>
                            <div className="mt-3 text-center sm:mt-2">
                                <DialogTitle
                                    as="h3"
                                    className="text-base font-semibold leading-6 text-lightblue text-medium text-2xl"
                                >
                                    {title}
                                </DialogTitle>
                                <div className="mt-2">
                                    <p className="text-sm">
                                        {description}
                                    </p>
                                </div>
                            </div>
                            {children}
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

export default Modal;
