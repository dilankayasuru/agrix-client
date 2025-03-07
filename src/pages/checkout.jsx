import MobileNav from "../components/mobileNav";
import Payment from "../components/payment";
import {useLocation, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import CropOrder from "../components/checkout/cropOrder";
import {jwtDecode} from "jwt-decode";
import {Toaster, toaster} from "../components/ui/toaster";
import TransportOrder from "../components/checkout/transportOrder";
import StorageOrder from "../components/checkout/storageOrder";
import {APIProvider} from "@vis.gl/react-google-maps";
import axios from "axios";

const Checkout = () => {

    const location = useLocation();
    const [listing, setListing] = useState(null);
    const [user, setUser] = useState(null);
    const [data, setData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(true);
    const navigate = useNavigate();

    const handleDonationOrder = async () => {
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + localStorage.getItem('jwtToken');

        await axios.post(`${process.env.REACT_APP_SERVER_URL}/order/crop`, {
            stripeId: null,
            order: {
                address: data.address,
                amount: data.subTotal,
                cropId: listing.CropListing.id,
                deliveryMethod: data.deliveryMethod,
                qty: listing.qty,
            }
        })
            .then(_ => {
                toaster.create({
                    title: "Order placed successfully!",
                    type: 'success',
                    duration: 2000,
                    onStatusChange({status}) {
                        if (status === 'unmounted') {
                            axios.defaults.headers.common['Authorization'] = 'Bearer ' + localStorage.getItem('jwtToken');
                            axios.delete(`${process.env.REACT_APP_SERVER_URL}/offers/${listing.offerId}`);
                            navigate('/');
                        }
                    },
                })
            })
            .catch((error) => {
                toaster.create({
                    title: error.response ? error.response.data.message : error.message,
                    type: 'error',
                });
            })
    }

    const handleClick = () => {
        if (location.state?.is_donation && data.subTotal <= 0) {
            handleDonationOrder();
            return;
        }
        if (!data) {
            toaster.create({
                type: 'error',
                title: 'Order is not initialized!',
                duration: 2000
            });
            setIsProcessing(true);
            return
        }
        if (data.name === "") {
            toaster.create({
                type: 'error',
                title: 'Please provide your name!',
                duration: 2000
            });
            setIsProcessing(true);
            return
        }
        if (data.address === "") {
            toaster.create({
                type: 'error',
                title: 'Please provide your address!',
                duration: 2000
            });
            setIsProcessing(true);
            return;
        }
        setIsProcessing(false);
        console.log(data)
        console.log(user)
        console.log(listing)
    }

    useEffect(() => {
        async function getUser() {
            const token = localStorage.getItem('jwtToken');
            if (token) {
                const decoded = await jwtDecode(token);
                setUser(decoded.user);
            }
        }

        getUser();
    }, []);

    useEffect(() => {
        setListing(location.state);
    }, [location.state]);

    useEffect(() => {
        if (!user || !listing) return;
        if (listing.CropListing) {
            const deliveryOption = listing.CropListing.delivery_options === "both" ? 'deliver' : listing.CropListing.delivery_options
            // This is where we process data to send to backend
            setData({
                name: user.first_name + ' ' + user.last_name,
                address: user.address || "",
                subTotal: listing.qty * listing.CropListing.price_per_kg,
                deliveryFee: (listing.CropListing.delivery_fare_per_kg * listing.qty) || 0,
                deliveryOption: deliveryOption,
            });
        }
        if (listing.TransportListing) {
            // This is where we process data to send to backend - Transport data
            setData({
                name: user.first_name + ' ' + user.last_name,
                address: user.address || "",
                subTotal: listing.total,
                distance: listing.distance,
                selectedDate: listing.selectedDate,
                locations: listing.locations,
            });
        }
        if (listing.StorageListing) {
            // This is where we process data to send to backend - Storage data
            setData({
                name: user.first_name + ' ' + user.last_name,
                address: user.address || "",
                subTotal: listing.total,
                startDate: listing.startDate,
                endDate: listing.endDate,
                duration: listing.duration,
            });
        }
    }, [user, listing]);

    return (listing && user && data &&
        <div>
            <Toaster/>
            <MobileNav/>
            <div className="h-dvh w-full mt-12">
                <div className="flex justify-center items-center p-4 w-full h-full">
                    <div className="w-full sm:max-w-sm md:max-w-lg">
                        {isProcessing ?
                            <div className="mb-8">
                                {listing.CropListing &&
                                    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                                        <CropOrder listing={listing} data={data} setData={setData}/>
                                    </APIProvider>
                                }
                                {listing.TransportListing &&
                                    <TransportOrder listing={listing} data={data} setData={setData}/>
                                }
                                {listing.StorageListing &&
                                    <StorageOrder listing={listing} data={data} setData={setData}/>
                                }
                                <button
                                    onClick={handleClick}
                                    type="submit"
                                    disabled={!listing || !data || !user}
                                    className="px-4 py-2 rounded bg-primary-green text-white font-medium mt-4 w-full disabled:opacity-25 shadow-xl active:shadow-md active:translate-y-0.5 transition-all duration-300">
                                    Proceed to checkout
                                </button>
                            </div> :
                            <>
                                <h1 className="text-xl mb-8">Payment options</h1>
                                <Payment order={data} user={user} listing={listing}/>
                            </>
                        }
                    </div>
                </div>

            </div>
        </div>
    )
};

export default Checkout;