#!/usr/bin/env python
import s3
import yaml

DEFAULT_CONFIG_FILENAME = 's3.yaml'

class S3(object):
    def __init__(self, config_filename=DEFAULT_CONFIG_FILENAME):
        self.config = self.get_config(config_filename)
        self.connection = s3.S3Connection(**self.config['s3'])    
        self.storage = s3.Storage(self.connection)

    def get_config(self, config_filename):
        with open(config_filename, 'r') as fi:
            return yaml.load(fi)

