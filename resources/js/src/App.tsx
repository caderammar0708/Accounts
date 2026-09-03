export const usePageHeader = () => {
    return {
        setTitle: (title) => {
            // Can be implemented later, for now does nothing to avoid errors
            if (typeof document !== 'undefined') {
                document.title = title;
            }
        },
        setActions: (actions) => {
            // Does nothing
        }
    };
};
