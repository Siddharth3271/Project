import {Box,Button,Menu,MenuButton,MenuItem,MenuList,Text} from "@chakra-ui/react";
const languages=Object.entries(LANGUAGE_VERSIONS)
import React from 'react'
import { LANGUAGE_VERSIONS } from "../constants";
import { ChevronDownIcon } from '@chakra-ui/icons'
const LangaugeSelector = () => {
  return (
    <Box>
        <Text mb={2} fontSize="lg" >
        Language:
        </Text>
        <Menu>
  <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
    C++
  </MenuButton>
  <MenuList>
        {
        languages.map(([lang,version])=>(
            <MenuItem key={lang}>{lang}
            &nbsp;
            <Text fontSize="xs" color="gray.600">{version}</Text>
            </MenuItem>
        ))
    }
  </MenuList>
    </Menu>
    </Box>
  )
}

export default LangaugeSelector
