
export const Flex = ({
    row: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    column: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    colJustify: {
        horizontal: {
            start: {
                alignItems: 'flex-start'
            },
            center: {
                alignItems: 'center'
            }
        },
        vertical: {
            start: {
                justifyContent: 'flex-start'
            },
            center: {
                justifyContent: 'center'
            },
            marginalStart: {
                alignItems: 'flex-start',
                marginLeft: '10px'
            }
        }
    },
    rowJustify: {
        horizontal: {
            start: {
                justifyContent: 'flex-start'
            },
            center: {
                justifyContent: 'center'
            },
            marginalStart: {
                justifyContent: 'flex-start',
                marginLeft: '10px'
            }
        },
        vertical: {
            start: {
                alignItems: 'flex-start'
            },
            center: {
                alignItems: 'center'
            }
        }
    },
    centrify: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }
})