import {IoChevronBack} from "react-icons/io5";
import {useEffect, useState} from "react";
import axios from "axios";
import OrdersTable from "../../components/dashboard/ordersTable";
import {useLocation, useNavigate} from "react-router-dom";

const Orders = () => {

    const navigate = useNavigate();
    const {userType} = useLocation();
    const [orders, setOrders] = useState();

    useEffect(() => {
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + localStorage.getItem('jwtToken');
        axios.get(`${process.env.REACT_APP_SERVER_URL}/orders`)
            .then(res => {
                if (res.data.cropOrders) {
                    setOrders(res.data.cropOrders);
                } else if (res.data.transportOrders) {
                    setOrders(res.data.transportOrders)
                } else if (res.data.storageOrders) {
                    setOrders(res.data.storageOrders)
                }
            })
            .catch(err => {
                if (err.response) {
                    console.log(err.response.data.message)
                } else {
                    console.log(err.message);
                }
            })
    }, []);

    return (
        <div className="p-4 w-full mb-20">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="md:hidden md:invisible">
                    <IoChevronBack className="text-2xl"/>
                </button>
                <p className="text-xl font-medium">Incoming Orders</p>
            </div>
            <div className="py-4">
                {orders &&
                    <OrdersTable orders={orders} userType={userType}/>
                }
            </div>
        </div>
    )
};

export default Orders;