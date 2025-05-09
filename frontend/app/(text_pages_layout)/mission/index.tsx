import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native"
import { useThemeContext } from "@/context/ThemeContext"
import { ScrollView } from 'react-native';

/**
 * MissionScreen Component
 *
 * This component displays the application's mission statement and its alignment with the UN Sustainable Development Goals (SDGs).
 * It provides information about EcoNexus's purpose, how it supports sustainable cities and communities, and links to relevant resources.
 *
 * Key Features:
 *   - Displays the application's mission statement and core values.
 *   - Highlights the connection between EcoNexus and UN Sustainable Development Goal (SDG) 11: Sustainable Cities and Communities.
 *   - Provides information on how EcoNexus enhances recycling incentives and awareness.
 *   - Includes a link to the UN SDG 11 website for more information.
 *   - Uses a ScrollView to accommodate varying content lengths.
 *   - Utilizes the ThemeContext to ensure consistent styling and appearance.
 *
 * Functionality:
 *   - Renders a container with the mission statement, a quote, and detailed information about EcoNexus's goals.
 *   - Implements a handlePress function to open URLs in a web browser when links are pressed.
 *   - Displays a link to the UN SDG 11 website, allowing users to learn more about the initiative.
 *
 * Components:
 *   - TouchableOpacity: Used to create clickable links that open URLs.
 *   - ScrollView: Used to enable scrolling for long content.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

const MissionScreen = () => {
  const { theme } = useThemeContext()

  const handlePress = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log(`Cannot open URL: ${url}`);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.bg_primary,
      justifyContent: "center",
      alignItems: "center",
    },
    titleWrapper: {
      alignItems: "center",
      marginBottom: 20,
      marginTop: 20,
    },
    titleContainer: {
      position: "relative",
      alignItems: "center",
    },
    title: {
      fontSize: 30,
      fontWeight: "bold",
      marginBottom: 2,
      color: theme.text,
    },
    underline: {
      position: "absolute",
      bottom: -2,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.primary,
      width: "auto",
    },
    quoteContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    italicText: {
      fontStyle: "italic",
      fontSize: 18,
      color: theme.text,
    },
    contentCard: {
      backgroundColor: theme.bg_secondary,
      borderRadius: 12,
      flexGrow: 0,
      marginHorizontal: 10,
      marginBottom: 20,
    },
    paragraph: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.text,
      marginBottom: 15, textAlign: "left",
    },
    boldText: {
      fontWeight: "bold",
    },
    sectionTitle: {
      fontWeight: "bold",
      fontSize: 18,
      color: theme.text,
      marginBottom: 8,
    },
    link: {
      fontWeight: "bold",
      color: theme.primary,
      textDecorationLine: "underline",
    }
  })

  return (
    <View style={styles.container}>
      <View style={styles.titleWrapper}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Our Mission</Text>
          <View style={styles.underline} />
        </View>
      </View>
      
      <View style={styles.quoteContainer}>
        <Text style={styles.italicText}>"Scan, Sort, Save"</Text>
      </View>
      
      <ScrollView style={styles.contentCard}
      contentContainerStyle={{padding: 10}}>
        <Text style={styles.paragraph}>
          Inspired by <Text style={styles.boldText}>UN Sustainable Development Goal (SDG) 11: Sustainable Cities and Communities</Text>, EcoNexus
          is an application designed to enhance recycling incentives and awareness. Using barcode recognition and
          location-based services, EcoNexus helps users identify recyclable items and provides real-time information 
          on where they can be appropriately disposed of within the local community.
        </Text>
        
        <Text style={styles.paragraph}>
          By making recycling more accessible and rewarding, EcoNexus aims to increase user engagement by informing
          and visually enhancing their recycling experience. This will help to achieve sustainability goals in your area 
          while recording local statistics for data collection to support efforts in making the environment a cleaner and 
          safer space for all.
        </Text>

        <Text style={styles.paragraph}>
          The UN Sustainable Development Goals (SDG) are a universal blueprint for achieving a better and more sustainable 
          future for all. Adopted by all United Nations Member States in 2015 as part of the 2030 Agenda for Sustainable 
          Development, they consist of 17 interconnected goals designed to address global challenges such as poverty, 
          inequality, climate change, and environmental degradation. Each goal has specific targets and measurable indicators
          to track progress. EcoNexus focuses on Goal 11 (Sustainable Cities and Communities) and Goal 12 (Responsible Consumption and Production).
        </Text>

        <Text style={styles.sectionTitle}>How EcoNexus supports the Sustainable Cities and Communities initiative</Text>
        <Text style={styles.paragraph}>
          Sustainable cities focus on initiatives such as waste reduction, recycling programmes and clean energy solutions. While 
          most users of this application will track their personal statistics, we also provide a section where local councils
          can log recycling data specific to their area. This feature will enhance our understanding of how to improve 
          the acessibility and effectiveness of recycling within your community.
        </Text>

        <Text style={styles.paragraph}> 
          For more information on the UN Sustainable Development Goal (SDG) 11, 
          <TouchableOpacity onPress={() => handlePress('https://sdgs.un.org/goals/goal11#overview')}>
            <Text style={styles.link}>click here</Text>
          </TouchableOpacity>.
        </Text>
      </ScrollView>
    </View>
  )
}

export default MissionScreen
