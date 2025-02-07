import {Text, View, Button} from "react-native";


// function to fetch data from the backend, just for testing purposes
async function testAPI() {
    try {
        // flask is running on port 5000, and the endpoint is /api/test/
        const response = await fetch("http://localhost:5001/api/test/");
        const data = await response.json();  

        alert("Wonderful! Response from the Backend (API) is: " + JSON.stringify(data));
    } catch (error) {
        alert("Failed to fetch from API: " + error.message + "\nDid you start the flask?");
    }
}

const style : Object = {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.88)",
}

export default function Main() {
    return (
        <View style={style}>
            <Text style={{ fontSize: 24,
                           color: "white",
                        textAlign: "center"}}
            >
            Well done! You're running react native app in web!{"\n"}
            There is only one file for now: <Text style={{ fontWeight: "bold" }}>/frontend/app/index.tsx</Text>{"\n"}
            Why don't you go there to see how things work? :){"\n"}Good luck!
            </Text>
            <Button title="Test Backend (make sure it is started!) - PRESS ME"onPress={ () => {testAPI()}}/>
        </View>
    );
}
