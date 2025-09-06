import React from 'react';
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon } from '@chakra-ui/icons';
import { LANGUAGE_VERSIONS } from "../constants";

const ACTIVE_COLOR = "blue.400";
const languages = Object.entries(LANGUAGE_VERSIONS);

const LanguageSelector = ({ language, onSelect }) => {
  return (
    <Box ml={2} mb={4}>
      <Flex align="center">
        <Text mr={2} fontSize="lg">
          Language:
        </Text>
        <Menu isLazy>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
            {language}
          </MenuButton>
          <MenuList bg="#110c1b">
            {languages.map(([lang, version]) => (
              <MenuItem
                key={lang}
                color={lang === language ? ACTIVE_COLOR : "inherit"}
                bg={lang === language ? "gray.900" : "transparent"}
                _hover={{
                  color: ACTIVE_COLOR,
                  bg: "gray.900",
                }}
                onClick={() => onSelect(lang)}
              >
                {lang}
                &nbsp;
                <Text as="span" fontSize="xs" color="gray.600">
                  {version}
                </Text>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};

export default LanguageSelector;
