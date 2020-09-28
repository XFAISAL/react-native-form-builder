import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet
} from 'react-native';
import { Button } from 'react-native-elements';
import { componentName, skipValidationForFields } from './constant'
import { getComponent, getValidator} from './componentMap'

export default function DynamicForm({ formTemplate, onSubmit }) {
  const [formFields, setFormFields] = useState({});
  const [isValidFormFields, setValid] = useState(false);
  const mandatoryFields = formTemplate.data.filter(data => data.is_mandatory);

  useEffect(() => {
    setFormFields({
      ...formFields,
      ...setDefaultForFields()
    });
  }, []);
  
  useEffect(() => {
    const isValid = checkAllMandatoryFields();
    setValid(isValid);
  }, [JSON.stringify(formFields)]);

  const onChangeInputValue = (fieldName, inputType) => value => {
    setFormFields({
      ...formFields,
      [fieldName]: {
        ...formFields[fieldName] || {},
        value,
        inputType,
      }
    });
  };

  const setDefaultForFields = () => {
    const fields = {}
    formTemplate.data.forEach(data => {
      if (data.component === componentName.CHECKBOX) {
        fields[data.field_name] = {
          value: false,
          inputType: data.component,
        }
      }
      if (data.component === componentName.DATE_PICKER) {
        const today = new Date();
        const currentDate = `${today.getFullYear()}-${`0${today.getMonth() + 1}`.slice(-2)}-` +
          `${today.getDate()}`;

        fields[data.field_name] = {
          value: currentDate,
          inputType: data.component,
        }
      }
    });

    return fields;
  }

  const getValue = element => {
    return formFields[element.field_name]?.value;
  }

  const onSumbitButtonPress = () => {
    onSubmit(formFields);
  }

  const checkAllMandatoryFields = () => {
    for (const field of mandatoryFields) {
      const key = field.field_name;

      if (skipValidationForFields.includes(field.component)) {
        continue;
      }

      const data = formFields[key];
      const validator = data && getValidator(data.inputType);

      if (!data || (!data.value || (validator && !validator(data.value, key))) &&
        (data.value !== false && data.value !== 0)) {
        return false;
      }
    }

    return true;
  }

  return (
    <View style={styles.container}>
      {
        formTemplate && formTemplate.data.map(element => {
          const Component = getComponent(element.component);
          return Component && <Component
            index={element.index}
            name={element.field_name}
            meta={element.meta}
            style={element.style}
            value={getValue(element)}
            onChangeInputValue={onChangeInputValue(element.field_name, element.component)}
            isMandatory={element.is_mandatory}
            index={element.index}
          />;
        })
      }
      <Button
        accessibilityLabel='submit-button'
        title='Submit'
        buttonStyle={styles.button}
        onPress={onSumbitButtonPress}
        disabled={!isValidFormFields}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    width: '40%',
    alignSelf: 'center',
    margin: 20
  }
});

function inputTextValidator(text, inputType) {
  const reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

  if (inputType === 'email') {
    return text && reg.test(text);
  }

  return true;
};