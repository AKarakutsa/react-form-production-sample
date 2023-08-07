import * as Yup from 'yup';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import Autocomplete, {createFilterOptions} from '@mui/material/Autocomplete';
import InputAdornment from "@mui/material/InputAdornment";
import TextField from '@mui/material/TextField';
import {Popper, PopperProps} from "@mui/material";
// utils
import {fData} from 'src/utils/format-number';
// types
import {AccountGeneralFormValues, PhoneNumber, UserDTO} from 'src/types/user';
// components
import Iconify from 'src/components/iconify';
import {useSnackbar} from 'src/components/snackbar';
import FormProvider, {
    RHFSelect,
    RHFTextField,
    RHFUploadAvatar,
} from 'src/components/hook-form';
import useLocales from 'src/locales/use-locales';
import {Town} from 'src/types/general';
import {useDispatch, useSelector} from "../../redux/store";
import {getRegions} from "../../redux/slices/region";
import {getTowns} from "../../redux/slices/town";
import {useAuthContext} from "../../auth/hooks";
import {countriesExtended} from "../../assets/data/countriesExtended";
import {putUserGeneral} from "../../redux/slices/user";


// ----------------------------------------------------------------------

type FormValuesProps = AccountGeneralFormValues;

// Constant for the desired number of phone fields.
const PHONE_FIELD_COUNT = 3;

const styles = {
    popper: {
        width: "300px"
    }
};

const PopperMy: React.FC<PopperProps> = (props) => <Popper {...props} style={styles.popper} placement="bottom-start"/>

export default function AccountGeneral() {
    const {t, allLangs, onChangeLang, currentLang} = useLocales();
    const {user, initialize} = useAuthContext();
    const regions = useSelector(state => state.region.entities);
    const towns = useSelector(state => state.town.entities);
    const [filteredTowns, setFilteredTowns] = useState<Town[]>(
        user?.region && towns.length > 0 ?
            towns.filter((town) => town.regionId === user.region) :
            []
    );
    const dispatch = useDispatch();
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        if (towns.length === 0) {
            dispatch(getTowns());
        }
    }, [dispatch, towns.length]);

    useEffect(() => {
        if (regions.length === 0) {
            dispatch(getRegions());
        }
    }, [dispatch, regions.length]);

    const translations = useMemo(() => ({
        avatar: {
            dropHelperText: t('account.form.avatar.dropHelperText'),
        },
        form: {
            validation: {
                userIdRequired: t("dashboard.account.form.validation.userIdRequired"),
                userIdMaxLength: t("dashboard.account.form.validation.userIdMaxLength"),
                firstNameMaxLength: t("dashboard.account.form.validation.firstNameMaxLength"),
                lastNameMaxLength: t("dashboard.account.form.validation.lastNameMaxLength"),
                emailRequired: t("dashboard.account.form.validation.emailRequired"),
                emailInvalid: t("dashboard.account.form.validation.emailInvalid"),
                emailMaxLength: t("dashboard.account.form.validation.emailMaxLength"),
                birthdayFutureNotAllowed: t("dashboard.account.form.validation.birthdayFutureNotAllowed"),
                townWhenRegionNotSet: t("dashboard.account.form.validation.townWhenRegionNotSet"),
                sexInvalid: t("dashboard.account.form.validation.sexInvalid"),
                phoneNumberInvalidFormat: t("dashboard.account.form.validation.phoneNumberInvalidFormat"),
                phoneNumbersMaxLength: t("dashboard.account.form.validation.phoneNumbersMaxLength"),
                aboutMaxLength: t('"dashboard.account.form.validation.aboutMaxLength')
            },
            labels: {
                firstName: t('dashboard.account.form.labels.firstName'),
                lastName: t('dashboard.account.form.labels.lastName'),
                birthday: t('dashboard.account.form.labels.birthday'),
                region: t('dashboard.account.form.labels.region'),
                town: t('dashboard.account.form.labels.town'),
                gender: t('dashboard.account.form.labels.gender'),
                lang: t('dashboard.account.form.labels.lang'),
                userId: t('dashboard.account.form.labels.userId'),
                email: t('dashboard.account.form.labels.email'),
                phoneNumber: t('dashboard.account.form.labels.phoneNumber'),
                phoneCode: t('dashboard.account.form.labels.phoneCode'),
                about: t('dashboard.account.form.labels.about'),
            },
            gender: {
                male: t('dashboard.account.form.gender.male'),
                female: t('dashboard.account.form.gender.female')
            },
            none: t('dashboard.account.form.none'),
            dropHelperText: t('dashboard.account.form.avatar.dropHelperText', {
                maxSize: fData(3145728),
            }),
            saveChangesButton: t('dashboard.account.form.saveChangesButton'),
            updateSuccess: t('dashboard.account.snackbar.updateSuccess')
        },
    }), [t]);

    const UpdateUserSchema = Yup.object().shape({
        userDTO: Yup.object().shape({
            userId: Yup.string()
                .required(translations.form.validation.userIdRequired)
                .max(191, translations.form.validation.firstNameMaxLength),
            firstName: Yup.string()
                .max(50, translations.form.validation.firstNameMaxLength),
            lastName: Yup.string()
                .max(50, translations.form.validation.lastNameMaxLength),
            email: Yup.string()
                .required(translations.form.validation.emailRequired)
                .email(translations.form.validation.emailInvalid)
                .max(191, translations.form.validation.emailMaxLength),
            langKey: Yup.string(),
            birthday: Yup.date()
                .nullable()
                .max(new Date(), translations.form.validation.birthdayFutureNotAllowed),
            region: Yup.number()
                .nullable()
                .transform((value, originalValue) =>
                    originalValue === '' ? undefined : value
                ),
            town: Yup.number()
                .nullable()
                .transform((value, originalValue) =>
                    originalValue === '' ? undefined : value
                )
                .test({
                    name: 'userDTO.town',
                    message: translations.form.validation.townWhenRegionNotSet,
                    test: (townId, testContext) => {
                        const regionId = testContext.parent.region;
                        return regionId === undefined || regionId === null ? townId === undefined || townId === null : true;
                    },
                }),
            avatar: Yup.mixed()
                .nullable(),
            sex: Yup.number()
                .nullable()
                .transform((value, originalValue) =>
                    originalValue === '' ? undefined : value
                )
                .oneOf([0, 1], translations.form.validation.sexInvalid),
            phoneNumbers: Yup.array()
                .of(
                    Yup.object().shape({
                        phoneCode: Yup.string()
                            .nullable()
                            .transform((value, originalValue) =>
                                originalValue === '' ? undefined : value
                            ),
                        number: Yup.string()
                            .nullable()
                            .transform((value, originalValue) =>
                                originalValue === '' ? undefined : value
                            )
                            .matches(/^[1-9]\d{1,14}$/, translations.form.validation.phoneNumberInvalidFormat)
                    })
                )
                .max(3, translations.form.validation.phoneNumbersMaxLength),
            about: Yup.string().max(1000, translations.form.validation.aboutMaxLength),
        }),
    });

    const defaultValues: AccountGeneralFormValues = {
        userDTO: {
            userId: user?.userId || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            langKey: user?.langKey || '',
            birthday: user?.birthday || null,
            region: user?.region || '',
            town: user?.town || '',
            avatar: user?.avatar || '',
            sex: user?.sex || '',
            phoneNumbers: Array.from({length: PHONE_FIELD_COUNT}, (_, index) => (
                user?.phoneNumbers && user.phoneNumbers[index]
                    ? {
                        phoneCode: user.phoneNumbers[index].split(" ")[0],
                        number: user.phoneNumbers[index].split(" ")[1],
                    }
                    : {phoneCode: '380', number: ''}
            )),
            about: user?.about || '',
        }
    };

    const adaptFormValuesToUserDTO = (formValues: AccountGeneralFormValues): UserDTO => ({
        userId: formValues.userDTO.userId || null,
        password: null, // Assuming password fields are not part of this form
        newPassword: null,
        firstName: formValues.userDTO.firstName || null,
        lastName: formValues.userDTO.lastName || null,
        email: formValues.userDTO.email || null,
        langKey: formValues.userDTO.langKey || null,
        birthday: formValues.userDTO.birthday,
        region: formValues.userDTO.region || null,
        town: formValues.userDTO.town || null,
        activationKey: null,
        resetKey: null,
        deleteKey: null,
        avatar: typeof formValues.userDTO.avatar === 'string' ? formValues.userDTO.avatar : null,
        activated: null,
        sex: formValues.userDTO.sex || null,
        userDealersMember: null,
        rememberMe: null,
        phoneNumbers: formValues.userDTO.phoneNumbers.map(phone => {
            const phoneCode = phone.phoneCode === null || phone.phoneCode === undefined ? '' : phone.phoneCode;
            const number = phone.number === null || phone.number === undefined ? '' : phone.number;
            return `${phoneCode} ${number}`;
        }),
        about: formValues.userDTO.about || null,
        roles: null
    });


    const methods = useForm<FormValuesProps>({
        resolver: yupResolver(UpdateUserSchema),
        defaultValues,
    });

    const {
        watch,
        control,
        setValue,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = methods;

    // const watchedValues = watch();
    // useEffect(() => {
    //     console.log(watchedValues);
    // }, [watchedValues]);


    const onSubmit = useCallback(
        async (data: FormValuesProps) => {
            try {
                const userDTO = adaptFormValuesToUserDTO(data);
                dispatch(putUserGeneral?.(userDTO));
                await initialize();
                enqueueSnackbar(translations.form.updateSuccess);
            } catch (error) {
                console.error('Error during submission:', error); // Add this line
            }
        },
        [dispatch, enqueueSnackbar, initialize, translations.form.updateSuccess]
    );

    const handleChangeLang = useCallback(
        (event: React.ChangeEvent<{ value: unknown }>) => {
            const selectedLangKey = event.target.value as string;
            setValue('userDTO.langKey', selectedLangKey, {shouldValidate: true});
            onChangeLang(selectedLangKey);
        },
        [onChangeLang, setValue]
    );

    const handleRegionChange = useCallback(
        (event: React.ChangeEvent<{ value: unknown }>) => {
            const selectedRegionId = event.target.value as number;
            const townsForRegion = towns.filter((town) => town.regionId === selectedRegionId);
            setFilteredTowns(townsForRegion);
            setValue('userDTO.region', selectedRegionId, {shouldValidate: true});
        },
        [towns, setValue]
    );

    const handlePhoneNumberChange = (index: number, fieldName: keyof PhoneNumber, value: string | null | undefined) => {
        setValue(`userDTO.phoneNumbers[${index}].${fieldName}` as any, value || "", {shouldValidate: true});
    };


    const handleDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];

            const newFile = Object.assign(file, {
                preview: URL.createObjectURL(file),
            });

            if (file) {
                setValue('userDTO.avatar', newFile, {shouldValidate: true});
            }
        },
        [setValue]
    );

    const filterOptions = createFilterOptions({
        matchFrom: 'any',
        stringify: (option: {
            phoneCode: string,
            label: string,
            labelUa: string,
            labelRu: string,
            countryCode: string
        }) => `${option.label} ${option.labelUa} ${option.labelRu} ${option.phoneCode}`,
    });

    return (
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                <Grid xs={12} md={4}>
                    <Card sx={{pt: 10, pb: 5, px: 3, textAlign: 'center'}}>
                        <RHFUploadAvatar
                            name="userDTO.avatar"
                            maxSize={3145728}
                            onDrop={handleDrop}
                            helperText={
                                <Typography
                                    variant="caption"
                                    sx={{
                                        mt: 3,
                                        mx: 'auto',
                                        display: 'block',
                                        textAlign: 'center',
                                        color: 'text.disabled',
                                    }}
                                >
                                    {translations.form.dropHelperText}
                                </Typography>
                            }
                        />

                    </Card>
                </Grid>

                <Grid xs={12} md={8}>
                    <Card sx={{p: 3}}>
                        <Box
                            rowGap={3}
                            columnGap={2}
                            display="grid"
                            gridTemplateColumns={{
                                xs: 'repeat(1, 1fr)',
                                sm: 'repeat(2, 1fr)',
                            }}
                        >
                            <RHFTextField name="userDTO.firstName" label={translations.form.labels.firstName}/>
                            <RHFTextField name="userDTO.lastName" label={translations.form.labels.lastName}/>
                            <RHFSelect name="userDTO.region" label={translations.form.labels.region}
                                       onChange={handleRegionChange}>
                                <MenuItem value="">{translations.form.none}</MenuItem>
                                <Divider sx={{borderStyle: 'dashed'}}/>
                                {regions.map((region) => (
                                    <MenuItem key={region.id} value={region.id}>
                                        {region.region}
                                    </MenuItem>
                                ))}
                            </RHFSelect>
                            <RHFSelect name="userDTO.town" label={translations.form.labels.town}>
                                <MenuItem value="">{translations.form.none}</MenuItem>
                                <Divider sx={{borderStyle: 'dashed'}}/>
                                {filteredTowns.map((town) => (
                                    <MenuItem key={town.id} value={town.id}>
                                        {town.town}
                                    </MenuItem>
                                ))}
                            </RHFSelect>
                            <RHFTextField name="userDTO.userId" label={translations.form.labels.userId}/>
                            <RHFTextField name="userDTO.email" label={translations.form.labels.email}/>

                            {Array.from({length: PHONE_FIELD_COUNT}, (_, index) => (
                                // const [phoneCode, number] = phoneNumber.split(" ");
                                (
                                    <React.Fragment key={index}>
                                        <Grid container spacing={2}>
                                            <Grid xs={6}>
                                                <Controller
                                                    name={`userDTO.phoneNumbers[${index}].phoneCode` as any}
                                                    control={control}
                                                    render={({field, fieldState: {error}}) => (
                                                        <Autocomplete
                                                            {...field}
                                                            PopperComponent={PopperMy}
                                                            value={countriesExtended.find((country) => country.phoneCode === field.value)}
                                                            options={countriesExtended}
                                                            filterOptions={filterOptions}
                                                            isOptionEqualToValue={(option, value) => option.phoneCode === value.phoneCode}
                                                            getOptionLabel={(option) => option.phoneCode}
                                                            onChange={(event, newValue) => handlePhoneNumberChange(index, "phoneCode", newValue?.phoneCode)}
                                                            renderInput={(params) => {
                                                                const inputValue = params.inputProps.value || "";
                                                                const selectedCountry = countriesExtended.find(
                                                                    (country) => typeof inputValue === "string" && country.phoneCode.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                                                );
                                                                const {
                                                                    phoneCode,
                                                                    label,
                                                                    labelUa,
                                                                    labelRu,
                                                                    countryCode
                                                                } = selectedCountry || {
                                                                    phoneCode: "",
                                                                    label: "",
                                                                    labelUa: "",
                                                                    labelRu: "",
                                                                    countryCode: ""
                                                                };
                                                                return (
                                                                    <TextField
                                                                        {...params}
                                                                        placeholder={translations.form.labels.phoneCode}
                                                                        InputProps={{
                                                                            ...params.InputProps,
                                                                            autoComplete: 'new-password', // disable autocomplete and autofill
                                                                            startAdornment: (
                                                                                <>
                                                                                    <InputAdornment position="start">
                                                                                        <Box
                                                                                            component="span"
                                                                                            sx={{
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                                position: 'relative'
                                                                                            }}
                                                                                        >
                                                                                            <Iconify
                                                                                                key={label}
                                                                                                icon={`circle-flags:${countryCode.toLowerCase()}`}
                                                                                                width={28}
                                                                                                sx={{mr: 1}}
                                                                                            />
                                                                                        </Box>
                                                                                    </InputAdornment>
                                                                                    {params.InputProps.startAdornment}
                                                                                </>
                                                                            )
                                                                        }}
                                                                        sx={{
                                                                            '.MuiInputBase-root': {
                                                                                position: 'relative'
                                                                            },
                                                                            '.MuiInputAdornment-root': {
                                                                                position: 'absolute',
                                                                                top: '50%',
                                                                                transform: 'translateY(-50%)',
                                                                                left: '10px',
                                                                                zIndex: 1
                                                                            },
                                                                            '.MuiInputBase-input': {
                                                                                paddingLeft: '80px' // adjust this value as per the size of your icon
                                                                            },
                                                                            '.MuiOutlinedInput-root .MuiAutocomplete-input': {
                                                                                padding: '7.5px 4px 7.5px 40px'
                                                                            }
                                                                        }}
                                                                    />
                                                                );
                                                            }}
                                                            renderOption={(props, option) => {
                                                                const {
                                                                    countryCode,
                                                                    label,
                                                                    labelUa,
                                                                    labelRu,
                                                                    phoneCode
                                                                } = countriesExtended.filter(
                                                                    (country) => country.label === option.label
                                                                )[0];

                                                                if (!label) {
                                                                    return null;
                                                                }

                                                                return (
                                                                    <li {...props} key={label}>
                                                                        <Iconify
                                                                            key={label}
                                                                            icon={`circle-flags:${countryCode.toLowerCase()}`}
                                                                            width={28}
                                                                            sx={{mr: 1}}
                                                                        />
                                                                        {label} +{phoneCode}
                                                                    </li>
                                                                );
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid xs={6}>
                                                <RHFTextField
                                                    name={`userDTO.phoneNumbers[${index}].number`}
                                                    label={translations.form.labels.phoneNumber}
                                                    onChange={(e) => handlePhoneNumberChange(index, "number", e.target.value)}
                                                />
                                            </Grid>
                                        </Grid>
                                    </React.Fragment>
                                )
                            ))}

                            <Controller
                                name="userDTO.birthday"
                                control={control}
                                render={({field, fieldState: {error}}) => (
                                    <DatePicker
                                        {...field}
                                        label={translations.form.labels.birthday}
                                        format="dd/MM/yyyy"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                error: !!error,
                                                helperText: error?.message,
                                            },
                                        }}
                                    />
                                )}
                            />
                            <RHFSelect name="userDTO.sex" label={translations.form.labels.gender}>
                                <MenuItem value="">{translations.form.none}</MenuItem>
                                <Divider sx={{borderStyle: 'dashed'}}/>
                                <MenuItem key={1} value={1}>{translations.form.gender.male}</MenuItem>
                                <MenuItem key={0} value={0}>{translations.form.gender.female}</MenuItem>
                            </RHFSelect>
                            <RHFSelect name="userDTO.langKey" label={translations.form.labels.lang}
                                       onChange={handleChangeLang}>
                                {allLangs.map((option) => (
                                    <MenuItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {t(`dashboard.lang.${option.value}`)}
                                    </MenuItem>
                                ))}
                            </RHFSelect>
                        </Box>

                        <Stack spacing={3} alignItems="flex-end" sx={{mt: 3}}>
                            <RHFTextField name="userDTO.about" multiline rows={4}
                                          label={translations.form.labels.about}/>

                            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                                {translations.form.saveChangesButton}
                            </LoadingButton>
                        </Stack>
                    </Card>
                </Grid>
            </Grid>
        </FormProvider>
    );
}
